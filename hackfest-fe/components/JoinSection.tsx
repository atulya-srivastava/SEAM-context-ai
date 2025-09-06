import React from "react";
import Image from "next/image";
function JoinSection() {
  const url = [
    "/notion.png",
    "/teams1.png",
    "/docs1.png",
    "/download.png",
    "/slackimg.png",
  ];

  return (
    <div className="flex flex-col justify-center items-center my-12 w-full">
      <h3 className="text-[#e1e7fe] text-2xl text-bold">
        We integrate many platforms on one single platform
      </h3>
      <div className="flex justify-between gap-8 mt-4 ">
        {url.map((e, idx) => (
          <Image
            key={e}
            src={e}
            alt={`Logo ${idx + 1}`}
            width={180}
            height={100}
            style={{ objectFit: "contain" }}
          />
        ))}
      </div>
    </div>
  );
}

export default JoinSection;
