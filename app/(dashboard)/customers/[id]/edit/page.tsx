/**
 * Customer Edit Page
 *
 * Allows users to edit an existing customer.
 *
 * @see screen-specification.md - S-07 顧客登録・編集画面
 */

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "@/components/features/customer/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const customerId = parseInt(params.id);

  if (isNaN(customerId)) {
    notFound();
  }

  // Fetch customer data
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
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

  // Format initial data
  const initialData = {
    customer_name: customer.customerName,
    address: customer.address || undefined,
    phone: customer.phone || undefined,
    email: customer.email || undefined,
    assigned_employee_id: customer.assignedEmployeeId,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">顧客編集</h1>
        <p className="text-muted-foreground">
          顧客情報を編集します
        </p>
      </div>

      <CustomerForm
        mode="edit"
        customerId={customerId}
        initialData={initialData}
        employees={employees}
      />
    </div>
  );
}
