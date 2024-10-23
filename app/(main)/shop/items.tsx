"use client";

import { refillHearts } from "@/action/user-progress";
import { createStripeUrl } from "@/action/user-subscription";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";

const POINTS_TO_REFILL = 10;

type Props = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const Items = ({ hearts, points, hasActiveSubscription }: Props) => {
  const [pending, startTransition] = useTransition();

  const onRefillHearts = () => {
    if (pending || hearts === 5 || points < POINTS_TO_REFILL) {
      return;
    }
    startTransition(() => {
      refillHearts().catch(() => toast.error("Something Went Wrong!"));
    });
  };

  const onUpgrade = () => {
    startTransition(() => {
      createStripeUrl()
        .then((response) => {
          if (response.data) {
            window.location.href = response.data;
          }
        })
        .catch(() => toast.error("Something Went Wrong"));
    });
  };

  return (
    <ul className="w-full">
      <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
        <Image src="/heart.svg" alt="Heart" height={60} width={60} />
        <div className="flex">
          <p className="text-neutral-700 text-base font-bold lg:text-lg">
            Refill Hearts
          </p>
        </div>
        <div className="ml-20">
          <Button
            disabled={pending || hearts === 5 || points < POINTS_TO_REFILL}
            onClick={onRefillHearts}
          >
            {hearts === 5 ? (
              "full"
            ) : (
              <div className="flex items-center">
                <Image src="points.svg" alt="Points" height={20} width={20} />
                <p>{POINTS_TO_REFILL}</p>
              </div>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
        <Image src="/unlimited.svg" alt="Unlimited" height={60} width={60} />
        <div className="flex-1">
          <p className="text-neutral-700 text-base font-bold lg:text-lg">
            Unlimited hearts
          </p>
        </div>
        <Button disabled={pending || hasActiveSubscription} onClick={onUpgrade}>
          {hasActiveSubscription ? "active" : "upgrade"}
        </Button>
      </div>
    </ul>
  );
};
