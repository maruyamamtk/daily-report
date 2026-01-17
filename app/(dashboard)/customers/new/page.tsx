/**
 * Customer Creation Page
 *
 * Allows users to create a new customer.
 *
 * @see screen-specification.md - S-07 顧客登録・編集画面
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "@/components/features/customer/customer-form";

export default async function NewCustomerPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch employees for the form
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">顧客登録</h1>
        <p className="text-muted-foreground">
          新しい顧客を登録します
        </p>
      </div>

      <CustomerForm mode="create" employees={employees} />
    </div>
  );
}
