const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const route = `
  app.post("/api/send-invite-email", async (req, res) => {
    try {
      const { emails } = req.body;
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: "No emails provided." });
      }

      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not configured. Simulating successful email dispatch.");
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1000));
        return res.status(200).json({ success: true, simulated: true, count: emails.length });
      }

      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      // We send emails concurrently
      const promises = emails.map((email) => 
        resend.emails.send({
          from: 'Reviuz <onboarding@resend.dev>',
          to: email,
          subject: 'How was your experience?',
          html: \`
            <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px;">
              <h2 style="color: #111827;">How was your experience?</h2>
              <p style="color: #4b5563; font-size: 16px;">
                Thank you for visiting! We'd love to hear your feedback. Click below to leave a quick video review.
              </p>
              <a href="https://reviuz.com" style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
                Record a Video Review
              </a>
            </div>
          \`
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      return res.status(200).json({ success: true, count: successful });
    } catch (err: any) {
      console.error("Error sending emails:", err);
      return res.status(500).json({ error: err.message || "Failed to send emails" });
    }
  });
`;

if (content.includes('/api/send-invite-email')) {
    console.log("Route already exists.");
} else {
    const lines = content.split('\n');
    const healthIndex = lines.findIndex(l => l.includes('app.get("/api/health"'));
    if (healthIndex !== -1) {
        lines.splice(healthIndex, 0, route);
        fs.writeFileSync('server.ts', lines.join('\n'));
        console.log("Successfully patched server.ts");
    } else {
        console.log("Could not find health index.");
    }
}
