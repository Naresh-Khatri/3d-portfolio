import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./style.module.scss";
import { opacity } from "../../anim";
import { cn } from "@/lib/utils";

interface IndexProps {
  src: string;
  isActive: boolean;
}

const Index: React.FC<IndexProps> = ({ src, isActive }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Fallback to a default image if the provided one fails
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Use landing.png as fallback
      setImgSrc("/assets/nav-link-previews/landing.png");
    }
  };

  return (
    <motion.div
      variants={opacity}
      initial="initial"
      animate={isActive ? "open" : "closed"}
      className={styles.imageContainer}
    >
      <Image
        src={imgSrc}
        width={400}
        height={400}
        className="my-32 w-full h-auto object-cover"
        alt={"Image"}
        onError={handleError}
        // priority={true}
      />
    </motion.div>
  );
};

export default Index;
