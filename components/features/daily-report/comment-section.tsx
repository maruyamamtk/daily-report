/**
 * Comment Section Component
 *
 * Displays comments on a daily report and allows managers/admins to post new comments.
 *
 * Features:
 * - List of existing comments with commenter name and timestamp
 * - Comment form for managers and admins
 * - Real-time updates after posting
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";

const COMMENT_MAX_LENGTH = 500;

interface Comment {
  id: number;
  commenterId: number;
  commentContent: string;
  createdAt: Date | string;
  commenter: {
    id: number;
    name: string;
  };
}

interface CommentSectionProps {
  reportId: number;
  comments: Comment[];
  canComment: boolean;
  currentUserId: number;
}

export function CommentSection({
  reportId,
  comments,
  canComment,
  currentUserId,
}: CommentSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      toast({
        title: "入力エラー",
        description: "コメント内容を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (commentContent.length > COMMENT_MAX_LENGTH) {
      toast({
        title: "入力エラー",
        description: `コメントは${COMMENT_MAX_LENGTH}文字以内で入力してください`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/daily-reports/${reportId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_content: commentContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error status codes
        if (response.status === 401) {
          throw new Error("認証が必要です。再度ログインしてください。");
        } else if (response.status === 403) {
          throw new Error("コメントを投稿する権限がありません。");
        } else if (response.status === 404) {
          throw new Error("日報が見つかりません。");
        }

        throw new Error(errorData.error?.message || "コメントの投稿に失敗しました");
      }

      toast({
        title: "投稿完了",
        description: "コメントを投稿しました",
      });

      // Clear form and refresh data
      setCommentContent("");
      router.refresh();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "投稿失敗",
        description:
          error instanceof Error
            ? error.message
            : "コメントの投稿中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;

    // Check if the date is invalid
    if (isNaN(d.getTime())) {
      return "日時不明";
    }

    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={comment.id}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{comment.commenter.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {comment.commentContent}
                  </div>
                </div>
              </div>
              {index < comments.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>コメントはまだありません</p>
        </div>
      )}

      {/* Comment Form (for managers and admins only) */}
      {canComment && (
        <>
          {comments.length > 0 && <Separator className="my-6" />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="comment">コメントを投稿</Label>
              <Textarea
                id="comment"
                placeholder={`コメント内容を入力してください（${COMMENT_MAX_LENGTH}文字以内）`}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="mt-2"
                aria-describedby="comment-char-count"
              />
              <p id="comment-char-count" className="text-xs text-muted-foreground mt-1">
                {commentContent.length} / {COMMENT_MAX_LENGTH}文字
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting || !commentContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "投稿中..." : "コメントを投稿"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
