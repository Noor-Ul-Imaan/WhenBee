import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { subscription, userId } = req.body

  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Missing subscription or userId' })
  }

  try {
    // Delete old subscription for this user if exists
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    // Save new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({ user_id: userId, subscription })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}