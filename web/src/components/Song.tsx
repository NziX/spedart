import { Art } from "@/types";
import { AudioLines, ThumbsUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const Song = ({
  thumbnail,
  title,
  likes,
  streams,
  artist,
  _id,
  pricing,
}: Art) => {
  return (
    <Card className="flex flex-col rounded-xl overflow-hidden h-[440px]">
      <div className="relative w-full h-[280px]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-col flex-1 p-4 justify-between">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-x-3">
            <h4 className="text-lg font-semibold line-clamp-2">{title}</h4>
            <div className="flex items-center gap-x-3 text-sm flex-shrink-0">
              <div className="flex items-center gap-x-1">
                <ThumbsUp size={12} />
                <p>{likes}</p>
              </div>
              <div className="flex items-center gap-x-1">
                <AudioLines size={12} />
                <p>{streams}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">
            {artist.stageName}
          </p>
        </div>

        <Link href={`/pre-releases/${_id}`} className="mt-auto">
          <Button
            variant="secondary"
            className="w-full hover:bg-primary hover:text-white transition-colors duration-200"
          >
            Listen for {pricing.currency} {pricing.price} &rarr;
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default Song;
