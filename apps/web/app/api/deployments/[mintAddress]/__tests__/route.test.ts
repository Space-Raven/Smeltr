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
const CHAIN_ID = "solana-mainnet";
const SESSION_WALLET = "SessionWallet11111111111111111111111111111";
const OTHER_WALLET = "OtherWallet111111111111111111111111111111";
const VALID_SIG = "3ABCDEFGHJKLMNPQRSTUVWXYZ23456789ABCDE";

function makeRequest(body: unknown, chainId = CHAIN_ID): Request {
  return new Request(
    `http://localhost/api/deployments/${MINT_ADDRESS}?chainId=${encodeURIComponent(chainId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const params = { params: { mintAddress: MINT_ADDRESS } };
const recordKey = { chainId: CHAIN_ID, mintAddress: MINT_ADDRESS };

describe("PATCH /api/deployments/[mintAddress]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockGetSessionWallet.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    mockGetSessionWallet.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    expect(res.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the mint address is not in the index", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 404 (not 403) when the record exists but belongs to a different wallet", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({
      ...recordKey,
      walletAddress: OTHER_WALLET,
      metadataAttached: false,
    });

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Not found" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("produces an identical response for 'not found' and 'not yours'", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);

    mockFindUnique.mockResolvedValueOnce(null);
    const notFoundRes = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    mockFindUnique.mockResolvedValueOnce({
      ...recordKey,
      walletAddress: OTHER_WALLET,
      metadataAttached: false,
    });
    const notYoursRes = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    expect(notFoundRes.status).toBe(notYoursRes.status);
    expect(await notFoundRes.json()).toEqual(await notYoursRes.json());
  });

  it("updates the record when the session wallet owns it", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({
      ...recordKey,
      walletAddress: SESSION_WALLET,
      metadataAttached: false,
    });
    mockUpdate.mockResolvedValue({
      ...recordKey,
      walletAddress: SESSION_WALLET,
      metadataAttached: true,
      metadataSignature: VALID_SIG,
    });

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { chainId_mintAddress: recordKey },
      data: { metadataAttached: true, metadataSignature: VALID_SIG },
    });
    expect(body.deployment.metadataAttached).toBe(true);
  });

  it("defaults chainId to solana-mainnet when query param is omitted", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({
      ...recordKey,
      walletAddress: SESSION_WALLET,
      metadataAttached: false,
    });
    mockUpdate.mockResolvedValue({
      ...recordKey,
      walletAddress: SESSION_WALLET,
      metadataAttached: true,
      metadataSignature: VALID_SIG,
    });

    const req = new Request(`http://localhost/api/deployments/${MINT_ADDRESS}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadataSignature: VALID_SIG }),
    });

    const res = await PATCH(req, params);

    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { chainId_mintAddress: recordKey },
    });
  });
});
