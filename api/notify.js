import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    const now = new Date()

    // Get all pending notifications that are due
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, tasks(title)')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())

    if (error) return res.status(500).json({ error: error.message })
    if (!notifications || notifications.length === 0) {
      return res.status(200).json({ sent: 0 })
    }

    let sent = 0

    for (const notification of notifications) {
      // Get user's push subscription
      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', notification.user_id)
        .limit(1)
        .single()

      if (!subData) continue

      try {
        await webpush.sendNotification(
          subData.subscription,
          JSON.stringify({
            title: 'WhenBee 🐝',
            body: `Hey, it's time. ${notification.tasks.title}`,
            icon: '/bee-icon.png'
          })
        )

        // Mark as sent
        await supabase
          .from('notifications')
          .update({ status: 'sent', sent_at: now.toISOString() })
          .eq('id', notification.id)

        sent++
      } catch (e) {
        console.error('Failed to send notification:', e)
      }
    }

    return res.status(200).json({ sent })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

