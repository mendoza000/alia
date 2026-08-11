import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SessionsReportEmailProps {
  psychologistName: string;
  formattedFrom: string;
  formattedTo: string;
  logoUrl: string;
  logoLightUrl: string;
  fontUrl: string;
}

export function SessionsReportEmail({
  psychologistName,
  formattedFrom,
  formattedTo,
  logoUrl,
  logoLightUrl,
  fontUrl,
}: SessionsReportEmailProps) {
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
      <Preview>Tu reporte de sesiones del {formattedFrom} al {formattedTo}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl}      className="logo-dark"  height={52} alt="ALIA" style={logoStyle} />
            <Img src={logoLightUrl} className="logo-light" height={52} alt="ALIA" style={{ ...logoStyle, display: "none" }} />
            <Text style={tagline}>Tu psicólogo aliado</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Tu reporte de sesiones
            </Heading>
            <Text style={intro}>
              Hola {psychologistName}, adjuntamos el reporte de tus sesiones y
              su estado de pago para el período seleccionado.
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>Período</Text>
              <Text style={cardValue}>
                {formattedFrom} — {formattedTo}
              </Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Adjunto</Text>
              <Text style={cardValue}>Reporte de sesiones (PDF)</Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Si tienes alguna pregunta sobre este reporte, responde este
              correo o contáctanos.
            </Text>
            <Text style={footerText}>© 2025 ALIA — Tu psicólogo aliado</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default SessionsReportEmail;

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

const card: React.CSSProperties = {
  backgroundColor: "#F9F4EE",
  borderRadius: "10px",
  padding: "20px 24px",
  margin: "0",
};

const cardLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#46494F",
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  margin: "0 0 3px 0",
};

const cardValue: React.CSSProperties = {
  fontSize: "16px",
  color: "#272727",
  fontWeight: "500",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#DBD4C2",
  margin: "14px 0",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#46494F",
  margin: "0 0 4px 0",
};
