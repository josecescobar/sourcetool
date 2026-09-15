import { Resend } from 'resend';

export class EmailService {
  private resend: Resend | null = null;
  private from: string;
  private webUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.from = process.env.EMAIL_FROM || 'SourceTool <noreply@sourcetool.io>';
    this.webUrl = process.env.WEB_URL || 'http://localhost:3000';
  }

  async sendVerificationEmail(email: string, token: string) {
    if (!this.resend) return;
    const url = `${this.webUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Verify your email — SourceTool',
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${url}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
      `,
    });
  }

  async sendTeamInviteEmail(email: string, token: string, teamName: string) {
    if (!this.resend) return;
    const url = `${this.webUrl}/invite?token=${token}`;

    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `You've been invited to ${teamName} — SourceTool`,
      html: `
        <h2>Team Invitation</h2>
        <p>You've been invited to join <strong>${teamName}</strong> on SourceTool.</p>
        <p><a href="${url}">Accept Invitation</a></p>
        <p>This invitation expires in 7 days.</p>
        <p>If you didn't expect this invitation, you can ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    if (!this.resend) return;
    const url = `${this.webUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Reset your password — SourceTool',
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
  }
}
