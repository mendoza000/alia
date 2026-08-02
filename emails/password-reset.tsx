import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  logoUrl: string;
  logoLightUrl: string;
  fontUrl: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  logoUrl,
  logoLightUrl,
  fontUrl,
}: PasswordResetEmailProps) {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Robecha Daniera"
          fallbackFontFamily={["Georgia", "serif"]}
          webFont={{ url: fontUrl, format: "truetype" }}
          fontWeight={400}
          fontStyle="normal"
        />
        <style>{`
          .logo-dark  { display: block !important; }
          .logo-light { display: none  !important; }
          @media (prefers-color-scheme: dark) {
            .logo-dark  { display: none  !important; }
            .logo-light { display: block !important; }
          }
        `}</style>
      </Head>
      <Preview>Restablece tu contraseña de ALIA</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl}      className="logo-dark"  height={52} alt="ALIA" style={logoStyle} />
            <Img src={logoLightUrl} className="logo-light" height={52} alt="ALIA" style={{ ...logoStyle, display: "none" }} />
            <Text style={tagline}>Tu psicólogo aliado</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Restablece tu contraseña
            </Heading>
            <Text style={intro}>
              Hola {userName}, recibimos una solicitud para restablecer tu
              contraseña. Si no fuiste tú, puedes ignorar este correo.
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button href={resetUrl} style={primaryButton}>
                Restablecer contraseña
              </Button>
            </Section>

            <Text style={message}>
              Este enlace vence en 1 hora por tu seguridad.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Si tienes preguntas, responde este correo.
            </Text>
            <Text style={footerText}>© 2025 ALIA — Tu psicólogo aliado</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

const body: React.CSSProperties = {
  backgroundColor: "#F9F4EE",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "0",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "48px 24px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "36px",
};

const logoStyle: React.CSSProperties = {
  margin: "0 auto 8px",
  display: "block",
};

const tagline: React.CSSProperties = {
  fontSize: "13px",
  color: "#46494F",
  margin: "0",
  textAlign: "center",
  letterSpacing: "0.04em",
};

const content: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "40px 36px",
  marginBottom: "24px",
};

const heading: React.CSSProperties = {
  fontFamily: "'Robecha Daniera', Georgia, serif",
  fontSize: "26px",
  fontWeight: "400",
  color: "#272727",
  margin: "0 0 12px 0",
  textAlign: "center",
};

const intro: React.CSSProperties = {
  fontSize: "15px",
  color: "#46494F",
  lineHeight: "1.6",
  margin: "0 0 28px 0",
  textAlign: "center",
};

const message: React.CSSProperties = {
  fontSize: "13px",
  color: "#46494F",
  lineHeight: "1.6",
  margin: "20px 0 0 0",
  textAlign: "center",
};

const primaryButton: React.CSSProperties = {
  backgroundColor: "#272727",
  color: "#FFFFFF",
  borderRadius: "8px",
  padding: "13px 28px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#46494F",
  margin: "0 0 4px 0",
};
