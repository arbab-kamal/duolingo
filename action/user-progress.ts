"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

import { getCourseById, getUserProgress } from "@/db/queries";
import db from "@/db/drizzle";
import { challengeProgress, challenges, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { error } from "console";

// TODO: Move alongside Item Component constant into a common file.
const POINTS_TO_REFILL = 10;

export const upsertUserProgress = async (courseId: number) => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const course = await getCourseById(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  // TODO: Enable once units and lessons are added
  // if (!course.units.length || !course.units[0].lessons.length) {
  //   throw new Error("Course is empty");
  // }

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db.update(userProgress).set({
      activeCourseId: courseId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot.svg",
    });

    revalidatePath("/learn");
    revalidatePath("/courses");
    redirect("/learn");
  }

  await db.insert(userProgress).values({
    userId,
    activeCourseId: courseId,
    userName: user.firstName || "User",
    userImageSrc: user.imageUrl || "/mascot.svg",
  });

  revalidatePath("/learn");
  revalidatePath("/courses");
  redirect("/learn");
};

export const reduceHearts = async (challengeId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("unAuthorized");
  }

  const currentUserProgress = await getUserProgress();
  // TODO: Get User Subscription
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge) {
    throw new Error("Challenge Not Found");
  }
  const lessonId = challenge.lessonId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;
  if (isPractice) {
    return { error: "Practice" };
  }

  if (!currentUserProgress) {
    throw new Error("User Progress Not Found");
  }

  // TODO: Handle Subscription

  if (currentUserProgress.hearts === 0) {
    return { error: "Hearts" };
  }

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) {
    throw new Error("User Progress not Found");
  }

  if (currentUserProgress.hearts === 5) {
    throw new Error("Hearts are already Filled.");
  }

  if (currentUserProgress.points < POINTS_TO_REFILL) {
    throw new Error("Not enough points");
  }
  await db.update(userProgress).set({
    hearts: 5,
    points: currentUserProgress.points - POINTS_TO_REFILL,
  }).where(eq(
    userProgress.userId , currentUserProgress.userId
  ))

  revalidatePath("/shop")
  revalidatePath("/learn")
  revalidatePath("/quests")
  revalidatePath("/leaderboard")
};
