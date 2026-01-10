/**
 * 403 Forbidden Page
 *
 * Displayed when a user attempts to access a resource
 * they don't have permission to view or modify.
 */

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Error code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-gray-900">403</h1>
          <h2 className="text-3xl font-semibold text-gray-800">
            アクセスが拒否されました
          </h2>
        </div>

        {/* Error message */}
        <div className="space-y-4">
          <p className="text-gray-600">
            このページまたは機能にアクセスする権限がありません。
          </p>
          <p className="text-sm text-gray-500">
            必要な権限をお持ちでない場合は、管理者にお問い合わせください。
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ホームに戻る
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            前のページに戻る
          </button>
        </div>

        {/* Additional help */}
        <div className="pt-8 text-sm text-gray-500">
          <p>アクセス権限について:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• 営業マスタの管理は管理者のみアクセス可能です</li>
            <li>• コメント投稿は上長・管理者のみ可能です</li>
            <li>• 日報の編集は作成者本人のみ可能です</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
