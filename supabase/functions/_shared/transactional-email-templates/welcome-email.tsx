import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "TX EventShare"

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Welkom bij {SITE_NAME} — je evenementen platform</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoWrap}>
          <div style={logo}>TX</div>
        </div>
        <Heading style={h1}>
          {name ? `Welkom, ${name}!` : `Welkom bij ${SITE_NAME}!`}
        </Heading>
        <Text style={text}>
          Geweldig dat je aan boord bent! Met {SITE_NAME} kun je eenvoudig evenementen aanmaken,
          beheren en promoten via je eigen website en social media.
        </Text>
        <Text style={text}>
          Hier zijn je eerste stappen:
        </Text>
        <Text style={listItem}>✦ Maak je eerste evenement aan</Text>
        <Text style={listItem}>✦ Plaats de agenda-widget op je website</Text>
        <Text style={listItem}>✦ Deel events via WhatsApp of social media</Text>
        <Hr style={hr} />
        <Button style={button} href="https://txeventshare.nl/app">
          Ga naar je dashboard
        </Button>
        <Text style={footer}>
          Vragen? Stuur een e-mail naar info@txeventshare.nl — we helpen je graag!
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welkom bij ${SITE_NAME}!`,
  displayName: 'Welkomstmail',
  previewData: { name: 'Jan' },
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
  margin: '0 0 16px',
}
const listItem = {
  fontSize: '14px',
  color: '#1a1a2e',
  lineHeight: '1.6',
  margin: '0 0 8px',
  paddingLeft: '8px',
}
const hr = { borderColor: '#eee', margin: '24px 0' }
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
