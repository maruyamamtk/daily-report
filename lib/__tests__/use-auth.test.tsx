/**
 * Tests for Client Components Authentication Hooks
 *
 * Tests authentication and authorization hooks for Client Components,
 * including role-based access control and navigation behavior.
 *
 * @see ../use-auth.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles";
import type { Session } from "next-auth";
import * as useAuthHooks from "../use-auth";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

/**
 * Helper function to create a mock session
 */
function createMockSession(
  role: string = UserRole.SALES,
  employeeId: number = 1,
  managerId: number | null = null
): Session {
  return {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role,
      employeeId,
      managerId,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

describe("use-auth - Client Components Authentication Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAuth", () => {
    it("should return session data from useSession", () => {
      const mockSessionData = {
        data: createMockSession(),
        status: "authenticated" as const,
      };
      vi.mocked(useSession).mockReturnValue(mockSessionData as any);

      const { result } = renderHook(() => useAuthHooks.useAuth());

      expect(result.current).toEqual(mockSessionData);
    });

    it("should return loading state", () => {
      const mockSessionData = {
        data: null,
        status: "loading" as const,
      };
      vi.mocked(useSession).mockReturnValue(mockSessionData as any);

      const { result } = renderHook(() => useAuthHooks.useAuth());

      expect(result.current.status).toBe("loading");
      expect(result.current.data).toBeNull();
    });
  });

  describe("useCurrentUser", () => {
    it("should return user from session", () => {
      const mockSession = createMockSession();
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCurrentUser());

      expect(result.current).toEqual(mockSession.user);
    });

    it("should return undefined when session is null", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCurrentUser());

      expect(result.current).toBeUndefined();
    });

    it("should return undefined when loading", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "loading",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCurrentUser());

      expect(result.current).toBeUndefined();
    });
  });

  describe("useRequireAuth", () => {
    it("should return user when authenticated", () => {
      const mockSession = createMockSession();
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useRequireAuth());

      expect(result.current).toEqual(mockSession.user);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should redirect to /login when unauthenticated", async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      renderHook(() => useAuthHooks.useRequireAuth());

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should not redirect while loading", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "loading",
      } as any);

      renderHook(() => useAuthHooks.useRequireAuth());

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("useRequireRole", () => {
    it("should return user when user has required role (single role)", () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useRequireRole(UserRole.ADMIN));

      expect(result.current).toEqual(mockSession.user);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should return user when user has one of the allowed roles (array)", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() =>
        useAuthHooks.useRequireRole([UserRole.MANAGER, UserRole.ADMIN])
      );

      expect(result.current).toEqual(mockSession.user);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should redirect to /forbidden when user lacks required role", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      renderHook(() => useAuthHooks.useRequireRole(UserRole.ADMIN));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/forbidden");
      });
    });

    it("should redirect to /login when unauthenticated", async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      renderHook(() => useAuthHooks.useRequireRole(UserRole.ADMIN));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should not redirect while loading", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "loading",
      } as any);

      renderHook(() => useAuthHooks.useRequireRole(UserRole.ADMIN));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("useHasRole", () => {
    it("should return true when user has the specified role", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useHasRole(UserRole.MANAGER));

      expect(result.current).toBe(true);
    });

    it("should return false when user has a different role", () => {
      const mockSession = createMockSession(UserRole.SALES);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useHasRole(UserRole.ADMIN));

      expect(result.current).toBe(false);
    });

    it("should return false when user is not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useHasRole(UserRole.SALES));

      expect(result.current).toBe(false);
    });
  });

  describe("useIsAdmin", () => {
    it("should return true when user is admin", () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsAdmin());

      expect(result.current).toBe(true);
    });

    it("should return false when user is not admin", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsAdmin());

      expect(result.current).toBe(false);
    });

    it("should return false when user is not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsAdmin());

      expect(result.current).toBe(false);
    });
  });

  describe("useIsManager", () => {
    it("should return true when user is manager", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsManager());

      expect(result.current).toBe(true);
    });

    it("should return false when user is not manager", () => {
      const mockSession = createMockSession(UserRole.SALES);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsManager());

      expect(result.current).toBe(false);
    });

    it("should return false when user is not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useIsManager());

      expect(result.current).toBe(false);
    });
  });

  describe("useCanComment", () => {
    it("should return true for managers", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanComment());

      expect(result.current).toBe(true);
    });

    it("should return true for admins", () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanComment());

      expect(result.current).toBe(true);
    });

    it("should return false for sales", () => {
      const mockSession = createMockSession(UserRole.SALES);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanComment());

      expect(result.current).toBe(false);
    });

    it("should return false when not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanComment());

      expect(result.current).toBe(false);
    });
  });

  describe("useCanAccessEmployeeManagement", () => {
    it("should return true for admins", () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanAccessEmployeeManagement());

      expect(result.current).toBe(true);
    });

    it("should return false for managers", () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanAccessEmployeeManagement());

      expect(result.current).toBe(false);
    });

    it("should return false for sales", () => {
      const mockSession = createMockSession(UserRole.SALES);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanAccessEmployeeManagement());

      expect(result.current).toBe(false);
    });

    it("should return false when not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanAccessEmployeeManagement());

      expect(result.current).toBe(false);
    });
  });

  describe("useCanEditReport", () => {
    it("should return true when user is the report owner", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(1));

      expect(result.current).toBe(true);
    });

    it("should return false when user is not the report owner", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(2));

      expect(result.current).toBe(false);
    });

    it("should return false when not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(1));

      expect(result.current).toBe(false);
    });

    it("should return false when reportEmployeeId is null", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(null));

      expect(result.current).toBe(false);
    });

    it("should return false when reportEmployeeId is undefined", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(undefined));

      expect(result.current).toBe(false);
    });

    it("should enforce ownership even for admins", () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(2));

      expect(result.current).toBe(false);
    });
  });

  describe("useCanViewReport", () => {
    it("should allow admin to view any report", () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(999, 888));

      expect(result.current).toBe(true);
    });

    it("should allow user to view their own report", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(1, null));

      expect(result.current).toBe(true);
    });

    it("should allow manager to view subordinate report", () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(20, 10));

      expect(result.current).toBe(true);
    });

    it("should deny sales viewing other's report", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(2, null));

      expect(result.current).toBe(false);
    });

    it("should deny manager viewing non-subordinate report", () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(20, 99));

      expect(result.current).toBe(false);
    });

    it("should deny when not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(1, null));

      expect(result.current).toBe(false);
    });

    it("should return false when reportEmployeeId is null", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(null, null));

      expect(result.current).toBe(false);
    });

    it("should return false when reportEmployeeId is undefined", () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(undefined, null));

      expect(result.current).toBe(false);
    });

    it("should handle null manager ID correctly", () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanViewReport(20, null));

      expect(result.current).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user in session", () => {
      vi.mocked(useSession).mockReturnValue({
        data: { expires: "2026-01-01" } as any,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCurrentUser());
      expect(result.current).toBeUndefined();
    });

    it("should handle null employeeId in session", () => {
      const mockSession = createMockSession(UserRole.SALES, null as any);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(1));
      expect(result.current).toBe(false);
    });

    it("should handle undefined employeeId in session", () => {
      const mockSession = createMockSession(UserRole.SALES, undefined as any);
      vi.mocked(useSession).mockReturnValue({
        data: mockSession,
        status: "authenticated",
      } as any);

      const { result } = renderHook(() => useAuthHooks.useCanEditReport(1));
      expect(result.current).toBe(false);
    });
  });
});
