type Props = {
  children: React.ReactNode;
};

import React from "react";

const Lessonlayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full w-full">{children}</div>
    </div>
  );
};

export default Lessonlayout;
