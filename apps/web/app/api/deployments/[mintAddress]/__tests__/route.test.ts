import { PATCH } from "../route";
import { prisma } from "../../../../../lib/prisma";
import { getSessionWallet } from "../../../../../lib/session";

jest.mock("../../../../../lib/prisma", () => ({
  prisma: {
    deployment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../../../lib/session", () => ({
  getSessionWallet: jest.fn(),
}));

const mockFindUnique = prisma.deployment.findUnique as jest.Mock;
const mockUpdate = prisma.deployment.update as jest.Mock;
const mockGetSessionWallet = getSessionWallet as jest.Mock;

const MINT_ADDRESS = "MintAddress1111111111111111111111111111111";
const SESSION_WALLET = "SessionWallet11111111111111111111111111111";
const OTHER_WALLET = "OtherWallet111111111111111111111111111111";

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/deployments/${MINT_ADDRESS}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: { mintAddress: MINT_ADDRESS } };

describe("PATCH /api/deployments/[mintAddress]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockGetSessionWallet.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockGetSessionWallet.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ metadataSignature: "sig" }), params);

    expect(res.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the mint address is not in the index", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ metadataSignature: "sig" }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 404 (not 403) when the record exists but belongs to a different wallet", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({
      mintAddress: MINT_ADDRESS,
      walletAddress: OTHER_WALLET,
      metadataAttached: false,
    });

    const res = await PATCH(makeRequest({ metadataSignature: "sig" }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  /**
   * The core anti-enumeration property: "doesn't exist" and "exists but
   * isn't yours" must be byte-for-byte indistinguishable responses. If a
   * future change makes these diverge (different message, different
   * status, an extra header, etc.), an attacker could use this endpoint to
   * enumerate which mint addresses other wallets have deployed.
   */
  it("produces an identical response for 'not found' and 'not yours'", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);

    mockFindUnique.mockResolvedValueOnce(null);
    const notFoundRes = await PATCH(makeRequest({ metadataSignature: "sig" }), params);

    mockFindUnique.mockResolvedValueOnce({
      mintAddress: MINT_ADDRESS,
      walletAddress: OTHER_WALLET,
      metadataAttached: false,
    });
    const notYoursRes = await PATCH(makeRequest({ metadataSignature: "sig" }), params);

    expect(notFoundRes.status).toBe(notYoursRes.status);
    expect(await notFoundRes.json()).toEqual(await notYoursRes.json());
  });

  it("updates the record when the session wallet owns it", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({
      mintAddress: MINT_ADDRESS,
      walletAddress: SESSION_WALLET,
      metadataAttached: false,
    });
    mockUpdate.mockResolvedValue({
      mintAddress: MINT_ADDRESS,
      walletAddress: SESSION_WALLET,
      metadataAttached: true,
      metadataSignature: "sig123",
    });

    const res = await PATCH(makeRequest({ metadataSignature: "sig123" }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { mintAddress: MINT_ADDRESS },
      data: { metadataAttached: true, metadataSignature: "sig123" },
    });
    expect(body.deployment.metadataAttached).toBe(true);
  });
});
