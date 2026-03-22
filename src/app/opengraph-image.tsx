import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ALIA — Tu psicólogo Aliado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
	const logoUrl = `${process.env.BETTER_AUTH_URL}/logo-alia-text-white.png`;

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				backgroundColor: "#272727",
				gap: "24px",
			}}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={logoUrl} width={300} height={75} alt="ALIA" />
			<p
				style={{
					color: "#DBD4C2",
					fontSize: 32,
					fontFamily: "sans-serif",
				}}
			>
				Tu psicólogo Aliado
			</p>
		</div>,
		{ ...size },
	);
}
