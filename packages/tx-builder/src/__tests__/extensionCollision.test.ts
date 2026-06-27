import { ExtensionType } from "@solana/spl-token";
import { assertNoExtensionCollision, ExtensionCollisionError } from "@platform/module-registry";

describe("assertNoExtensionCollision", () => {
  it("does not throw when module and metadata extension types are disjoint", () => {
    expect(() =>
      assertNoExtensionCollision(
        [ExtensionType.TransferFeeConfig, ExtensionType.PermanentDelegate],
        [ExtensionType.MetadataPointer],
        "token-2022-native"
      )
    ).not.toThrow();
  });

  it("throws ExtensionCollisionError when a module and a metadata provider configure the same extension", () => {
    // Hypothetical future module that (incorrectly) also touches MetadataPointer.
    expect(() =>
      assertNoExtensionCollision(
        [ExtensionType.MetadataPointer],
        [ExtensionType.MetadataPointer],
        "token-2022-native"
      )
    ).toThrow(ExtensionCollisionError);
  });

  it("error carries the colliding extension and provider id for diagnostics", () => {
    try {
      assertNoExtensionCollision(
        [ExtensionType.MetadataPointer],
        [ExtensionType.MetadataPointer],
        "token-2022-native"
      );
      throw new Error("expected assertNoExtensionCollision to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ExtensionCollisionError);
      expect((err as ExtensionCollisionError).providerId).toBe("token-2022-native");
      expect((err as ExtensionCollisionError).extension).toBe(ExtensionType.MetadataPointer);
    }
  });
});
