import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"

const BEEM_API_KEY = Deno.env.get('BEEM_API_KEY')
const BEEM_SECRET_KEY = Deno.env.get('BEEM_SECRET_KEY')
const BEEM_SENDER_ID = Deno.env.get('BEEM_SENDER_ID') || 'INFO'
const HOOK_SECRET = Deno.env.get('SEND_SMS_HOOK_SECRET')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const body = await req.text()
        const headers = Object.fromEntries(req.headers)

        let user, sms

        if (HOOK_SECRET) {
            const wh = new Webhook(HOOK_SECRET.replace('v1,whsec_', ''))
            const payload = wh.verify(body, headers) as any
            user = payload.user
            sms = payload.sms
        } else {
            const data = JSON.parse(body)
            user = data.user
            sms = data.sms
        }

        const phone = user?.phone
        const otp = sms?.otp

        if (!phone || !otp) {
            return new Response(JSON.stringify({ error: 'Missing phone or OTP' }), { status: 400 })
        }

        // Beem API logic
        const auth = btoa(`${BEEM_API_KEY}:${BEEM_SECRET_KEY}`)
        const payload = {
            source_addr: BEEM_SENDER_ID,
            schedule_time: '',
            encoding: 0,
            message: `Your AskMwalimu verification code is: ${otp}`,
            recipients: [
                {
                    recipient_id: 1,
                    dest_addr: phone.replace('+', '') // Beem usually expects numbers without +
                }
            ]
        }

        const response = await fetch('https://api.beem.africa/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('Beem API Error:', result)
            return new Response(JSON.stringify({ error: 'Failed to send SMS', details: result }), { status: 500 })
        }

        return new Response(JSON.stringify({ message: 'SMS sent successfully', result }), { status: 200 })

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
