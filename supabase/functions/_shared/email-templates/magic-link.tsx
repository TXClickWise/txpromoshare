/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je inloglink voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoWrap}>
          <div style={logo}>TX</div>
        </div>
        <Heading style={h1}>Je inloglink</Heading>
        <Text style={text}>
          Klik op de knop hieronder om in te loggen bij {siteName}. Deze link verloopt binnenkort.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Inloggen
        </Button>
        <Text style={footer}>
          Als je deze link niet hebt aangevraagd, kun je deze e-mail veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
