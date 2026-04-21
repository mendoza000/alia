import { prisma } from "@/lib/db";

export async function getAllCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        where: { status: "APPROVED" },
        select: { discountAmount: true },
      },
    },
  });

  return coupons.map((c) => ({
    ...c,
    totalDiscounted: c.payments.reduce((sum, p) => sum + p.discountAmount, 0),
    payments: undefined,
  }));
}

export type CouponRow = Awaited<ReturnType<typeof getAllCoupons>>[number];

export async function getCouponById(id: string) {
  return prisma.coupon.findUnique({ where: { id } });
}
