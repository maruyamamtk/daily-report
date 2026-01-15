/**
 * Customers List Page
 *
 * Displays list of customers with search and CRUD operations.
 *
 * @see screen-specification.md - S-06 顧客一覧画面
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerList } from "@/components/features/customer/customer-list";

export default async function CustomersPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch customers
  const customers = await prisma.customer.findMany({
    include: {
      assignedEmployee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      customerName: "asc",
    },
    take: 100,
  });

  // Fetch employees for filter
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Format customer data
  const customerData = customers.map((customer) => ({
    customer_id: customer.id,
    customer_name: customer.customerName,
    address: customer.address,
    phone: customer.phone,
    email: customer.email,
    assigned_employee_id: customer.assignedEmployeeId,
    assigned_employee_name: customer.assignedEmployee.name,
    created_at: customer.createdAt.toISOString(),
    updated_at: customer.updatedAt.toISOString(),
  }));

  // Calculate meta information
  const totalCount = await prisma.customer.count();
  const meta = {
    current_page: 1,
    total_pages: Math.ceil(totalCount / 100),
    total_count: totalCount,
    limit: 100,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">顧客一覧</h1>
        <p className="text-muted-foreground">
          担当顧客を管理します
        </p>
      </div>

      <CustomerList
        initialCustomers={customerData}
        initialMeta={meta}
        employees={employees}
      />
    </div>
  );
}
