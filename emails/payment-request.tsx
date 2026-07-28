import {
  Body,
  Button,
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

interface PaymentRequestEmailProps {
  patientName: string;
  psychologistName: string;
  formattedDate: string;
  finalAmount: number;
  currency: string;
  paymentUrl: string;
  logoUrl: string;
  logoLightUrl: string;
  fontUrl: string;
}

export function PaymentRequestEmail({
  patientName,
  psychologistName,
  formattedDate,
  finalAmount,
  currency,
  paymentUrl,
  logoUrl,
  logoLightUrl,
  fontUrl,
}: PaymentRequestEmailProps) {
  const formattedAmount = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(finalAmount);

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
      <Preview>Completa el pago de tu sesión con {psychologistName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl}      className="logo-dark"  height={52} alt="ALIA" style={logoStyle} />
            <Img src={logoLightUrl} className="logo-light" height={52} alt="ALIA" style={{ ...logoStyle, display: "none" }} />
            <Text style={tagline}>Tu psicólogo aliado</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={heading}>
              Completa el pago de tu sesión
            </Heading>
            <Text style={intro}>
              Hola {patientName}, aquí tienes el enlace para pagar tu sesión
              con {psychologistName}.
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>Psicólogo</Text>
              <Text style={cardValue}>{psychologistName}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Fecha y hora</Text>
              <Text style={cardValue}>{formattedDate}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Monto</Text>
              <Text style={cardValue}>{formattedAmount}</Text>
            </Section>

            <Section style={actions}>
              <Button href={paymentUrl} style={primaryButton}>
                Pagar ahora
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Si tienes alguna pregunta, responde este correo o contáctanos.
            </Text>
            <Text style={footerText}>© 2025 ALIA — Tu psicólogo aliado</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentRequestEmail;

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
  margin: "0 0 28px 0",
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

const actions: React.CSSProperties = {
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
