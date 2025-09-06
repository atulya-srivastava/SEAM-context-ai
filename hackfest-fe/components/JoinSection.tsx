import React from "react";
import Image from "next/image";
function JoinSection() {
  const url = [
    "/notion.png",
    "/teams1.png",
    "/docs1.png",
    "/github1.svg",
    "/svgslack.png",
  ];

  return (
    <div className="flex flex-col justify-center items-center my-12 w-full">
      <h3 className="text-[#e1e7fe] text-md">
        Join the maintainers and contributors to the <br /> largest open-source
        projects on our waitlist
      </h3>
      <div className="flex justify-between gap-4 mt-4 ">
        {url.map((e, idx) => (
          <Image
            key={e}
            src={e}
            alt={`Logo ${idx + 1}`}
            width={180}
            height={100}
          />
        ))}
      </div>
    </div>
  );
}

export default JoinSection;
