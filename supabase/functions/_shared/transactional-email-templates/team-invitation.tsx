import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "TX EventShare"

interface TeamInvitationProps {
  inviterName?: string
  teamName?: string
  role?: string
}

const TeamInvitationEmail = ({ inviterName, teamName, role }: TeamInvitationProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{inviterName || 'Iemand'} heeft je uitgenodigd voor {teamName || SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoWrap}>
          <div style={logo}>TX</div>
        </div>
        <Heading style={h1}>Uitnodiging voor het team</Heading>
        <Text style={text}>
          {inviterName ? <><strong>{inviterName}</strong> heeft</> : 'Je bent'} je uitgenodigd om lid te worden van{' '}
          <strong>{teamName || SITE_NAME}</strong>
          {role ? ` als ${role}` : ''}.
        </Text>
        <Text style={text}>
          Klik op de knop hieronder om de uitnodiging te accepteren en aan de slag te gaan.
        </Text>
        <Button style={button} href="https://txeventshare.nl/register">
          Uitnodiging accepteren
        </Button>
        <Text style={footer}>
          Als je deze uitnodiging niet verwachtte, kun je deze e-mail veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamInvitationEmail,
  subject: (data: Record<string, any>) =>
    `${data.inviterName || 'Iemand'} heeft je uitgenodigd voor ${data.teamName || SITE_NAME}`,
  displayName: 'Team uitnodiging',
  previewData: { inviterName: 'Jan', teamName: 'Café De Kroeg', role: 'editor' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 25px' }
const logoWrap = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = {
  display: 'inline-block',
  width: '48px',
  height: '48px',
  lineHeight: '48px',
  textAlign: 'center' as const,
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #e8710a, #d4650a)',
  color: '#ffffff',
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  fontWeight: 'bold' as const,
  fontSize: '18px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1a1a2e',
  margin: '0 0 20px',
  fontFamily: "'Space Grotesk', Arial, sans-serif",
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#e8710a',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
