import { useState } from "react";
import { motion } from "motion/react";
import styles from "./style.module.scss";
import { height } from "../anim";
import Body from "./body/body";
import Footer from "./footer/footer";
import Image from "./image/image";

import { links } from "@/components/header/config";
import { cn } from "@/lib/utils";

interface IndexProps {
  setIsActive: (isActive: boolean) => void;
}

interface SelectedLinkState {
  isActive: boolean;
  index: number;
}

const Index: React.FC<IndexProps> = ({ setIsActive }) => {
  const [selectedLink, setSelectedLink] = useState<SelectedLinkState>({
    isActive: false,
    index: 0,
  });

  return (
    <motion.div
      variants={height}
      initial="initial"
      animate="enter"
      exit="exit"
      className={styles.nav}
    >
      <div className={cn(styles.wrapper, 'flex justify-end sm:justify-start')}>
        <div className={styles.container}>
          <Body
            links={links}
            selectedLink={selectedLink}
            setSelectedLink={setSelectedLink}
            setIsActive={setIsActive}
          />
          {/* <Footer /> */}
        </div>
        <Image
          src={links[selectedLink.index].thumbnail}
          isActive={selectedLink.isActive}
        />
        {/* <p>{links[selectedLink.index].thumbnail}</p> */}
      </div>
    </motion.div>
  );
};

export default Index;
