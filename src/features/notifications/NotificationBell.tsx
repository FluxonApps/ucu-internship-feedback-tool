"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import type { NotificationDto } from "@/lib/notifications/types";

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as NotificationDto[];
        setNotifications(data);
      } finally {
        setLoading(false);
      }
    }

    void loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  async function markAsRead(
    notificationId: string,
    href: string,
) {
  const notification = notifications.find(
    (item) => item.id === notificationId,
  );

  if (!notification) {
    return;
  }

  if (!notification.readAt) {
    const response = await fetch(
      `/api/notifications/${encodeURIComponent(notificationId)}`,
      {
        method: "PATCH",
      },
    );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    console.error(
      body?.error ?? `Unable to mark notification as read (${response.status}).`,
    );
      return;
    }

    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              readAt,
            }
          : item,
      ),
    );
  }
  setOpen(false);
  router.push(href);
  }
  async function markAllAsRead() {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      console.error(
        body?.error ?? "Unable to mark all notifications as read.",
      );

      return;
    }

    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt,
      })),
    );

    setOpen(false);
  }

  return (
    <details
    className="relative"
    open={open}
    onToggle={(event) => {
        setOpen(event.currentTarget.open);
    }}
    >
      <summary
        aria-label="Notifications"
        className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-muted"
      >
        <Bell className="size-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                void markAllAsRead();
              }}
              className="text-xs font-medium text-[var(--brand-strong)] hover:underline"
            >
              Mark all as read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Loading notifications…
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.href}
                onClick={(event) => {
                    event.preventDefault();
                    void markAsRead(
                        notification.id,
                        notification.href
                    );
                }}
                className={`block border-b px-4 py-3 last:border-b-0 hover:bg-muted/60 ${
                  notification.readAt ? "" : "bg-[var(--brand-soft)]/40"
                }`}
              >
                <div className="flex gap-3">
                  {!notification.readAt ? (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--brand-strong)]" />
                  ) : (
                    <span className="mt-2 size-2 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </details>
  );
}
