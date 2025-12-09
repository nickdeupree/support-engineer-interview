"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface TransactionListProps {
  accountId: number;
  refreshTrigger?: number;
}

export function TransactionList({ accountId, refreshTrigger }: TransactionListProps) {
  const PAGE_SIZE = 10;
  const [offset, setOffset] = useState(0);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const { data: page, isLoading, refetch } = trpc.account.getTransactions.useQuery({ accountId, limit: PAGE_SIZE, offset });

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      // reset to first page when triggered
      setOffset(0);
      setAllTransactions([]);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  useEffect(() => {
    // Append page results to list and dedupe by id
    if (page && Array.isArray(page)) {
      setAllTransactions((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const combined = [...prev, ...page.filter((p) => !ids.has(p.id))];
        return combined;
      });
    }
  }, [page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if ((!allTransactions || allTransactions.length === 0) && !isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span>
                  {formatDate(transaction.createdAt!)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`capitalize ${transaction.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span>
                  {transaction.description || "-"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={transaction.type === "deposit" ? "text-green-600" : "text-red-600"}>
                  {transaction.type === "deposit" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {transaction.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 bg-white border-t flex justify-center">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load more"}
        </button>
      </div>
    </div>
  );
}
