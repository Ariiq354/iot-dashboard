export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      neutral: "mist",
    },
    card: {
      slots: {
        root: "shadow-lg flex-none",
      },
    },
    input: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        root: "w-full",
      },
    },
    inputNumber: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        root: "w-full",
      },
    },
    textarea: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        root: "w-full",
      },
    },
    button: {
      defaultVariants: {
        size: "lg",
      },
    },
    selectMenu: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "w-full",
      },
    },
    select: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "w-full",
      },
    },
    table: {
      slots: {
        th: "text-base",
        td: "text-base",
      },
    },
    modal: {
      slots: {
        footer: "justify-end",
      },
    },
  },
});
