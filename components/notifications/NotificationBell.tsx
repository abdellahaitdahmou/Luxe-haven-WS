"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    async function fetchNotifications() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error("Error fetching notifications:", JSON.stringify(error))
        }

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log("[NotificationBell] No user found, skipping subscription")
                return
            }

            console.log("[NotificationBell] Setting up realtime for user:", user.id)
            fetchNotifications()

            channel = supabase
                .channel('notifications_realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, (payload: any) => {
                    console.log("[NotificationBell] INSERT received:", payload)
                    if (payload.new.user_id === user.id) {
                        console.log("[NotificationBell] Notification match for current user!")
                        setNotifications(prev => [payload.new, ...prev.slice(0, 9)])
                        setUnreadCount(prev => prev + 1)

                        // Show real-time pop-up notification
                        toast(payload.new.title, {
                            description: payload.new.content,
                            action: payload.new.link ? {
                                label: 'View',
                                onClick: () => window.location.href = payload.new.link
                            } : undefined
                        })
                    }
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications'
                }, (payload: any) => {
                    console.log("[NotificationBell] UPDATE received:", payload)
                    if (payload.new.user_id === user.id) {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
                        if (payload.old.is_read === false && payload.new.is_read === true) {
                            setUnreadCount(prev => Math.max(0, prev - 1))
                        } else if (payload.old.is_read === true && payload.new.is_read === false) {
                            setUnreadCount(prev => prev + 1)
                        }
                    }
                })
                .subscribe((status) => {
                    console.log("[NotificationBell] Channel status:", status)
                })
        }

        setupRealtime()

        return () => {
            if (channel) {
                console.log("[NotificationBell] Cleaning up channel")
                const supabase = createClient()
                supabase.removeChannel(channel)
            }
        }
    }, [])

    const markAsRead = async (id: string) => {
        const supabase = createClient()
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition border border-white/10 group"
            >
                <Bell className="w-5 h-5 text-white group-hover:text-gold-400 transition" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={async () => {
                                            const supabase = createClient()
                                            const { data: { user } } = await supabase.auth.getUser()
                                            if (!user) return
                                            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
                                            setUnreadCount(0)
                                            setNotifications(prev => prev.map((n: any) => ({ ...n, is_read: true })))
                                        }}
                                        className="text-xs text-gold-500 hover:text-gold-400 transition"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <Link
                                            key={notif.id}
                                            href={notif.link || '#'}
                                            onClick={() => {
                                                markAsRead(notif.id)
                                                setIsOpen(false)
                                            }}
                                            className={`block p-4 border-b border-white/5 hover:bg-white/5 transition relative ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
                                        >
                                            {!notif.is_read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-600 rounded-full" />
                                            )}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-white text-xs font-medium">{notif.title}</span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {formatDistanceToNow(new Date(notif.created_at))} ago
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-xs line-clamp-2">{notif.content}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No notifications yet</p>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/dashboard"
                                className="block p-3 text-center text-xs text-gray-400 hover:text-white transition bg-white/5"
                                onClick={() => setIsOpen(false)}
                            >
                                View all dashboard activity
                            </Link>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
