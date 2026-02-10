import { config as defaultConfig } from "@gluestack-ui/config";
import { gluestackTokens } from "../constants/theme";

/**
 * BarterDash Gluestack UI Configuration
 * Dark Luxury theme with Gold accents
 */

export const config = {
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    ...gluestackTokens,
    colors: {
      ...defaultConfig.tokens.colors,
      ...gluestackTokens.colors,
    },
    space: {
      ...defaultConfig.tokens.space,
      ...gluestackTokens.space,
    },
    borderRadii: {
      ...defaultConfig.tokens.borderRadii,
      ...gluestackTokens.borderRadii,
    },
  },
  components: {
    ...defaultConfig.components,
    Button: {
      theme: {
        variants: {
          solid: {
            bg: "$primary700", // Gold primary
            borderColor: "$primary700",
            _text: {
              color: "$text0", // Black text on gold
              fontWeight: "$semibold",
            },
            _hover: {
              bg: "$primary600",
            },
            _pressed: {
              bg: "$primary500",
            },
            _disabled: {
              bg: "$primary400",
              borderColor: "$primary400",
              opacity: 0.5,
              _text: {
                color: "$text300",
              },
            },
          },
          outline: {
            bg: "transparent",
            borderColor: "$primary700",
            borderWidth: 2,
            _text: {
              color: "$primary700",
              fontWeight: "$semibold",
            },
            _hover: {
              bg: "$primary100",
            },
            _pressed: {
              bg: "$primary200",
            },
            _disabled: {
              borderColor: "$primary400",
              opacity: 0.5,
              _text: {
                color: "$primary400",
              },
            },
          },
          ghost: {
            bg: "transparent",
            _text: {
              color: "$text700",
            },
            _hover: {
              bg: "$background200",
            },
            _pressed: {
              bg: "$background300",
            },
          },
        },
        sizes: {
          xs: {
            px: "$2",
            py: "$1",
            _text: {
              fontSize: "$xs",
            },
          },
          sm: {
            px: "$3",
            py: "$1.5",
            _text: {
              fontSize: "$sm",
            },
          },
          md: {
            px: "$4",
            py: "$2.5",
            _text: {
              fontSize: "$md",
            },
          },
          lg: {
            px: "$5",
            py: "$3",
            _text: {
              fontSize: "$lg",
            },
          },
          xl: {
            px: "$6",
            py: "$3.5",
            _text: {
              fontSize: "$xl",
            },
          },
        },
      },
    },
    Input: {
      theme: {
        variants: {
          outline: {
            bg: "$background300", // Dark surface
            borderColor: "$border300",
            borderWidth: 1,
            _focus: {
              borderColor: "$primary700",
              borderWidth: 2,
            },
            _invalid: {
              borderColor: "$error400",
              borderWidth: 2,
            },
            _disabled: {
              bg: "$background200",
              borderColor: "$border200",
              opacity: 0.6,
            },
          },
          underlined: {
            bg: "transparent",
            borderWidth: 0,
            borderBottomWidth: 1,
            borderColor: "$border300",
            _focus: {
              borderBottomWidth: 2,
              borderColor: "$primary700",
            },
          },
        },
      },
    },
    Card: {
      theme: {
        baseStyle: {
          bg: "$background100", // Card background
          borderRadius: "$xl",
          borderWidth: 1,
          borderColor: "$border200",
        },
        variants: {
          elevated: {
            shadowColor: "$primary700",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          },
          outline: {
            borderWidth: 1,
            borderColor: "$border300",
          },
          filled: {
            bg: "$background200",
          },
        },
      },
    },
    Text: {
      theme: {
        baseStyle: {
          color: "$text950",
          fontFamily: "PlusJakartaSans",
        },
        variants: {
          heading: {
            fontWeight: "$bold",
            color: "$text950",
          },
          body: {
            fontWeight: "$normal",
            color: "$text700",
          },
          caption: {
            fontWeight: "$normal",
            color: "$text600",
            fontSize: "$sm",
          },
          muted: {
            fontWeight: "$normal",
            color: "$text500",
          },
        },
      },
    },
    Heading: {
      theme: {
        baseStyle: {
          color: "$text950",
          fontWeight: "$bold",
          fontFamily: "PlusJakartaSans",
        },
      },
    },
    Badge: {
      theme: {
        variants: {
          solid: {
            bg: "$primary700",
            _text: {
              color: "$text0",
              fontWeight: "$semibold",
            },
          },
          outline: {
            borderColor: "$primary700",
            borderWidth: 1,
            _text: {
              color: "$primary700",
              fontWeight: "$semibold",
            },
          },
          subtle: {
            bg: "$primary100",
            _text: {
              color: "$primary700",
              fontWeight: "$medium",
            },
          },
          success: {
            bg: "$success500",
            _text: {
              color: "$text0",
            },
          },
          error: {
            bg: "$error400",
            _text: {
              color: "$text0",
            },
          },
          live: {
            bg: "$rose500",
            _text: {
              color: "$text0",
              fontWeight: "$bold",
            },
          },
        },
      },
    },
    Spinner: {
      theme: {
        baseStyle: {
          color: "$primary700",
        },
      },
    },
    Divider: {
      theme: {
        baseStyle: {
          bg: "$border200",
        },
      },
    },
    Icon: {
      theme: {
        baseStyle: {
          color: "$text700",
        },
        variants: {
          primary: {
            color: "$primary700",
          },
          muted: {
            color: "$text500",
          },
        },
      },
    },
    Pressable: {
      theme: {
        baseStyle: {
          _pressed: {
            opacity: 0.7,
          },
        },
      },
    },
  },
};

export default config;
