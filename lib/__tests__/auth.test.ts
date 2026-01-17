/**
 * NextAuth Configuration Tests
 *
 * Tests the NextAuth configuration including:
 * - Credentials provider authorization logic
 * - JWT and Session callbacks
 * - Password verification
 * - User lookup and validation
 *
 * These tests cover TC-AUTH-001 through TC-AUTH-008 from test-specification.md
 *
 * @see ../auth.ts
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import bcrypt from "bcrypt";
import { authOptions } from "../auth";
import type { User } from "next-auth";

// Mock dependencies
vi.mock("../prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("../env", () => ({
  env: {
    NODE_ENV: "test",
    NEXTAUTH_SECRET: "test-secret-key-for-testing",
  },
}));

// Import mocked modules
import { prisma } from "../prisma";

/**
 * Helper to create mock user data from database
 */
function createMockDbUser(overrides: any = {}) {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    password: "$2b$10$hashedpassword",
    role: "営業",
    employeeId: 1,
    employee: {
      managerId: null,
      ...overrides.employee,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("NextAuth Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Strategy", () => {
    it("should use JWT session strategy", () => {
      expect(authOptions.session.strategy).toBe("jwt");
    });

    it("should set session max age to 30 days", () => {
      expect(authOptions.session.maxAge).toBe(30 * 24 * 60 * 60);
    });
  });

  describe("Page Configuration", () => {
    it("should configure sign in page as /login", () => {
      expect(authOptions.pages?.signIn).toBe("/login");
    });

    it("should configure sign out page as /", () => {
      expect(authOptions.pages?.signOut).toBe("/");
    });

    it("should redirect errors to /login", () => {
      expect(authOptions.pages?.error).toBe("/login");
    });
  });

  describe("Credentials Provider", () => {
    let credentialsProvider: any;

    beforeEach(() => {
      credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === "credentials"
      );
    });

    it("should have credentials provider configured", () => {
      expect(credentialsProvider).toBeDefined();
      expect(credentialsProvider.id).toBe("credentials");
      expect(credentialsProvider.name).toBe("Credentials");
    });

    describe("TC-AUTH-001: ログイン成功（正常系）", () => {
      it("should successfully authorize user with correct credentials", async () => {
        const mockUser = createMockDbUser();
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as Mock).mockResolvedValue(true);

        const result = await credentialsProvider.authorize({
          email: "test@example.com",
          password: "Test1234!",
        });

        expect(result).toEqual({
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "営業",
          employeeId: 1,
          managerId: null,
        });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@example.com" },
          include: { employee: true },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
          "Test1234!",
          "$2b$10$hashedpassword"
        );
      });

      it("should include managerId from employee relation", async () => {
        const mockUser = createMockDbUser({
          employee: { managerId: 10 },
        });
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as Mock).mockResolvedValue(true);

        const result = await credentialsProvider.authorize({
          email: "test@example.com",
          password: "Test1234!",
        });

        expect(result?.managerId).toBe(10);
      });

      it("should work for all roles (営業, 上長, 管理者)", async () => {
        const roles = ["営業", "上長", "管理者"];

        for (const role of roles) {
          const mockUser = createMockDbUser({ role });
          (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
          (bcrypt.compare as Mock).mockResolvedValue(true);

          const result = await credentialsProvider.authorize({
            email: "test@example.com",
            password: "Test1234!",
          });

          expect(result?.role).toBe(role);
        }
      });
    });

    describe("TC-AUTH-002: ログイン失敗 - 誤ったパスワード（異常系）", () => {
      it("should throw error for incorrect password", async () => {
        const mockUser = createMockDbUser();
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as Mock).mockResolvedValue(false);

        await expect(
          credentialsProvider.authorize({
            email: "test@example.com",
            password: "WrongPassword",
          })
        ).rejects.toThrow("メールアドレスまたはパスワードが正しくありません");
      });

      it("should not reveal if email exists (same error message)", async () => {
        const mockUser = createMockDbUser();
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as Mock).mockResolvedValue(false);

        const error = await credentialsProvider
          .authorize({
            email: "test@example.com",
            password: "WrongPassword",
          })
          .catch((e: Error) => e);

        expect(error.message).toBe(
          "メールアドレスまたはパスワードが正しくありません"
        );
      });
    });

    describe("TC-AUTH-003: ログイン失敗 - 存在しないメールアドレス（異常系）", () => {
      it("should throw error for non-existent email", async () => {
        (prisma.user.findUnique as Mock).mockResolvedValue(null);

        await expect(
          credentialsProvider.authorize({
            email: "nonexistent@example.com",
            password: "SomePassword",
          })
        ).rejects.toThrow("メールアドレスまたはパスワードが正しくありません");
      });

      it("should use same error message as wrong password (prevent enumeration)", async () => {
        (prisma.user.findUnique as Mock).mockResolvedValue(null);

        const nonExistentError = await credentialsProvider
          .authorize({
            email: "nonexistent@example.com",
            password: "SomePassword",
          })
          .catch((e: Error) => e);

        const mockUser = createMockDbUser();
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as Mock).mockResolvedValue(false);

        const wrongPasswordError = await credentialsProvider
          .authorize({
            email: "test@example.com",
            password: "WrongPassword",
          })
          .catch((e: Error) => e);

        expect(nonExistentError.message).toBe(wrongPasswordError.message);
      });
    });

    describe("TC-AUTH-004: ログイン - 必須項目未入力（異常系）", () => {
      it("should throw error when email is missing", async () => {
        await expect(
          credentialsProvider.authorize({
            email: "",
            password: "Test1234!",
          })
        ).rejects.toThrow("メールアドレスとパスワードを入力してください");
      });

      it("should throw error when password is missing", async () => {
        await expect(
          credentialsProvider.authorize({
            email: "test@example.com",
            password: "",
          })
        ).rejects.toThrow("メールアドレスとパスワードを入力してください");
      });

      it("should throw error when both email and password are missing", async () => {
        await expect(
          credentialsProvider.authorize({
            email: "",
            password: "",
          })
        ).rejects.toThrow("メールアドレスとパスワードを入力してください");
      });

      it("should throw error when credentials are undefined", async () => {
        await expect(
          credentialsProvider.authorize(undefined)
        ).rejects.toThrow("メールアドレスとパスワードを入力してください");
      });
    });

    describe("Security: Password Handling", () => {
      it("should throw error when user has no password set", async () => {
        const mockUser = createMockDbUser({ password: null });
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);

        await expect(
          credentialsProvider.authorize({
            email: "test@example.com",
            password: "Test1234!",
          })
        ).rejects.toThrow("メールアドレスまたはパスワードが正しくありません");
      });

      it("should not call bcrypt.compare when user is not found", async () => {
        (prisma.user.findUnique as Mock).mockResolvedValue(null);

        await credentialsProvider
          .authorize({
            email: "nonexistent@example.com",
            password: "Test1234!",
          })
          .catch(() => {});

        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it("should not call bcrypt.compare when password is null", async () => {
        const mockUser = createMockDbUser({ password: null });
        (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);

        await credentialsProvider
          .authorize({
            email: "test@example.com",
            password: "Test1234!",
          })
          .catch(() => {});

        expect(bcrypt.compare).not.toHaveBeenCalled();
      });
    });
  });

  describe("JWT Callback", () => {
    const jwtCallback = authOptions.callbacks?.jwt;

    it("should add user data to token on initial sign in", async () => {
      const token = { sub: "user-123" };
      const user = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      } as User;

      const result = await jwtCallback!({
        token,
        user,
        trigger: undefined as any,
        session: undefined as any,
      });

      expect(result).toEqual({
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      });
    });

    it("should handle null managerId correctly", async () => {
      const token = { sub: "user-123" };
      const user = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: undefined,
      } as User;

      const result = await jwtCallback!({
        token,
        user,
        trigger: undefined as any,
        session: undefined as any,
      });

      expect(result.managerId).toBeNull();
    });

    it("should update token name when session is updated", async () => {
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Old Name",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await jwtCallback!({
        token,
        user: undefined,
        trigger: "update",
        session: { name: "New Name" } as any,
      });

      expect(result.name).toBe("New Name");
    });

    it("should preserve existing token data when no user provided", async () => {
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await jwtCallback!({
        token,
        user: undefined,
        trigger: undefined as any,
        session: undefined as any,
      });

      expect(result).toEqual(token);
    });
  });

  describe("Session Callback (TC-AUTH-008)", () => {
    const sessionCallback = authOptions.callbacks?.session;

    it("should add user data from token to session", async () => {
      const session = {
        user: {},
        expires: "2026-12-31",
      };
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await sessionCallback!({
        session,
        token,
        user: undefined as any,
        newSession: undefined as any,
        trigger: undefined as any,
      });

      expect(result.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      });
    });

    it("should handle null managerId in session", async () => {
      const session = {
        user: {},
        expires: "2026-12-31",
      };
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await sessionCallback!({
        session,
        token,
        user: undefined as any,
        newSession: undefined as any,
        trigger: undefined as any,
      });

      expect(result.user.managerId).toBeNull();
    });

    it("should preserve session expiration", async () => {
      const session = {
        user: {},
        expires: "2026-12-31",
      };
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await sessionCallback!({
        session,
        token,
        user: undefined as any,
        newSession: undefined as any,
        trigger: undefined as any,
      });

      expect(result.expires).toBe("2026-12-31");
    });

    it("should handle missing session.user gracefully", async () => {
      const session = {
        expires: "2026-12-31",
      } as any;
      const token = {
        sub: "user-123",
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await sessionCallback!({
        session,
        token,
        user: undefined as any,
        newSession: undefined as any,
        trigger: undefined as any,
      });

      // Should return session unchanged when user is undefined
      expect(result.user).toBeUndefined();
    });
  });

  describe("Debug and Secret Configuration", () => {
    it("should use NEXTAUTH_SECRET from environment", () => {
      expect(authOptions.secret).toBe("test-secret-key-for-testing");
    });

    it("should enable debug in test environment", () => {
      expect(authOptions.debug).toBe(false); // Since NODE_ENV is 'test', not 'development'
    });
  });

  describe("Provider Configuration", () => {
    it("should have exactly one provider configured", () => {
      expect(authOptions.providers).toHaveLength(1);
    });

    it("should have credentials provider with correct fields", () => {
      const credentialsProvider = authOptions.providers[0] as any;

      expect(credentialsProvider.credentials).toHaveProperty("email");
      expect(credentialsProvider.credentials).toHaveProperty("password");
      expect(credentialsProvider.credentials.email.type).toBe("email");
      expect(credentialsProvider.credentials.password.type).toBe("password");
    });
  });
});
