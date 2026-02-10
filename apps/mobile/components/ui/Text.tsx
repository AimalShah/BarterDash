import * as React from 'react';
import { Text as RNText, TextStyle, TextProps } from 'react-native';
import { cn } from '../../lib/utils';
import { COLORS } from "@/constants/colors";
import { cva, type VariantProps } from 'class-variance-authority';

const textVariants = cva(
    '',
    {
        variants: {
            variant: {
                default: 'text-base',
                h1: 'text-4xl font-extrabold tracking-tight lg:text-5xl',
                h2: 'text-3xl font-semibold tracking-tight first:mt-0',
                h3: 'text-2xl font-semibold tracking-tight',
                h4: 'text-xl font-semibold tracking-tight',
                p: 'leading-7',
                lead: 'text-xl',
                large: 'text-lg font-semibold',
                small: 'text-sm font-medium leading-none',
                muted: 'text-sm',
            },
            weight: {
                default: 'font-normal',
                medium: 'font-medium',
                semibold: 'font-semibold',
                bold: 'font-bold',
            },
        },
        defaultVariants: {
            variant: 'default',
            weight: 'default',
        },
    }
);

interface Props extends TextProps, VariantProps<typeof textVariants> {
    className?: string;
    color?: string;
}

const Text = React.forwardRef<RNText, Props>(
    ({ className, variant, weight, color, ...props }, ref) => {
        // Get color based on variant
        const getTextColor = () => {
            if (color) return color;
            switch (variant) {
                case 'muted':
                case 'lead':
                    return COLORS.textSecondary;
                default:
                    return COLORS.textPrimary;
            }
        };

        return (
            <RNText
                className={cn(textVariants({ variant, weight, className }))}
                ref={ref}
                style={{ color: getTextColor() }}
                {...props}
            />
        );
    }
);
Text.displayName = 'Text';

export { Text, textVariants };
