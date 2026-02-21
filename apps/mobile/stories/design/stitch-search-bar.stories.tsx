import React, { useState } from 'react';
import { StitchSearchBar } from '@/components/design';

export default {
  title: 'Design/StitchSearchBar',
  component: StitchSearchBar,
  args: {
    placeholder: 'Search cards, sneakers, sellers...',
  },
};

export const Default = {
  render: (args: any) => {
    const [value, setValue] = useState('');
    return <StitchSearchBar {...args} value={value} onChangeText={setValue} />;
  },
};

export const WithFilterButton = {
  render: (args: any) => {
    const [value, setValue] = useState('Jordan 4');
    return (
      <StitchSearchBar
        {...args}
        value={value}
        onChangeText={setValue}
        onFilterPress={() => undefined}
      />
    );
  },
};
