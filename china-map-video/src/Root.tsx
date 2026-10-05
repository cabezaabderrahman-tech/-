import { Folder } from "remotion";
import { ChinaMapDataComposition } from "./ChinaMapData";
import { ProvinceCardComposition } from "./ProvinceCard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ChinaMapDataComposition />
      <Folder name="Elements">
        <ProvinceCardComposition />
      </Folder>
    </>
  );
};
