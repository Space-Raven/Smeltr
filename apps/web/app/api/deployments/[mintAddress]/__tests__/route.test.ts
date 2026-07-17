import { PATCH } from "../route";
import { prisma } from "../../../../../lib/prisma";
import { getSessionWallet } from "../../../../../lib/session";
import { checkMetadataAttachment } from "../../../../../lib/verifyDeployment";
import { fetchParsedTransactionWithRetry } from "../../../../../lib/fetchParsedTransaction";

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

// The on-chain fetch is network I/O — mocked here; checkMetadataAttachment is
// mocked too because its verdict logic has its own unit tests
// (lib/__tests__/verifyDeployment.test.ts). These tests cover the ROUTE's
// wiring: auth, ownership, validation, and verdict handling.
jest.mock("../../../../../lib/fetchParsedTransaction", () => ({
  fetchParsedTransactionWithRetry: jest.fn(),
}));

jest.mock("../../../../../lib/verifyDeployment", () => ({
  ...jest.requireActual("../../../../../lib/verifyDeployment"),
  checkMetadataAttachment: jest.fn(),
}));

const mockFindUnique = prisma.deployment.findUnique as jest.Mock;
const mockUpdate = prisma.deployment.update as jest.Mock;
const mockGetSessionWallet = getSessionWallet as jest.Mock;
const mockFetchTx = fetchParsedTransactionWithRetry as jest.Mock;
const mockCheckMetadata = checkMetadataAttachment as jest.Mock;

const MINT_ADDRESS = "MintAddress1111111111111111111111111111111";
const CHAIN_ID = "solana-mainnet";
const SESSION_WALLET = "SessionWallet11111111111111111111111111111";
const OTHER_WALLET = "OtherWallet111111111111111111111111111111";
// 64+ chars — matches the strict 64–88 base58 signature shape.
const VALID_SIG =
  "3ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz23456789ABCDE";

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

const ownedRecord = {
  ...recordKey,
  walletAddress: SESSION_WALLET,
  tokenStandard: "token-2022",
  metadataAttached: false,
};

describe("PATCH /api/deployments/[mintAddress]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockGetSessionWallet.mockReset();
    mockFetchTx.mockReset();
    mockCheckMetadata.mockReset();
    // Default: verification passes — individual tests override.
    mockFetchTx.mockResolvedValue({ tx: { fixture: true }, reachedNetwork: true });
    mockCheckMetadata.mockReturnValue({ ok: true });
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
    mockFindUnique.mockResolvedValue({ ...ownedRecord, walletAddress: OTHER_WALLET });

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

    mockFindUnique.mockResolvedValueOnce({ ...ownedRecord, walletAddress: OTHER_WALLET });
    const notYoursRes = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    expect(notFoundRes.status).toBe(notYoursRes.status);
    expect(await notFoundRes.json()).toEqual(await notYoursRes.json());
  });

  it("rejects a signature that is not 64-88 char base58", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(ownedRecord);

    const res = await PATCH(makeRequest({ metadataSignature: "tooShort" }), params);

    expect(res.status).toBe(400);
    expect(mockFetchTx).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 503 when the network is unreachable during verification", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(ownedRecord);
    mockFetchTx.mockResolvedValue({ tx: null, reachedNetwork: false });

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    expect(res.status).toBe(503);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("propagates the verdict when on-chain verification fails (Audit-2 High-2)", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(ownedRecord);
    mockCheckMetadata.mockReturnValue({
      ok: false,
      status: 400,
      reason: "Transaction does not attach metadata to this mint.",
    });

    const res = await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/does not attach metadata/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("passes the record's token standard to the verifier", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue({ ...ownedRecord, tokenStandard: "spl-legacy" });
    mockUpdate.mockResolvedValue({ ...ownedRecord, metadataAttached: true });

    await PATCH(makeRequest({ metadataSignature: VALID_SIG }), params);

    expect(mockCheckMetadata).toHaveBeenCalledWith(
      { fixture: true },
      MINT_ADDRESS,
      SESSION_WALLET,
      "spl-legacy"
    );
  });

  it("updates the record when the session wallet owns it and verification passes", async () => {
    mockGetSessionWallet.mockResolvedValue(SESSION_WALLET);
    mockFindUnique.mockResolvedValue(ownedRecord);
    mockUpdate.mockResolvedValue({
      ...ownedRecord,
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
    mockFindUnique.mockResolvedValue(ownedRecord);
    mockUpdate.mockResolvedValue({ ...ownedRecord, metadataAttached: true });

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
