import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

type UserRole = 'admin' | 'owner' | 'guest' | null

export function useUserRole() {
    const supabase = useMemo(() => createClient(), [])
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUserAndRole() {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUser(user)
                // Fetch profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setRole(profile.role as UserRole)
                }
            }
            setLoading(false)
        }

        fetchUserAndRole()
    }, [supabase])

    return { user, role, loading }
}
