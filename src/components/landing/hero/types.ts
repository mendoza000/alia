export type BentoCard =
    | {
          id: string;
          type: "photo";
          name: string;
          specialty: string;
          imgUrl: string;
          className: string;
      }
    | {
          id: string;
          type: "value";
          title: string;
          description: string;
          supportImg: string;
          bg: string;
          className: string;
          icon: React.ComponentType<{ className?: string }>;
          highlights: string[];
      }
    | {
          id: string;
          type: "decorative";
          supportImg: string;
          bg: string;
          className: string;
      };
