import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  /* background: #f5f4f1; */
  background: var(--r-neutral-card-1, #f3f2ef);
  border-radius: 12px;
  padding: 20px 12px 12px 8px;
`;

const Card = ({ children }: { children: React.ReactNode }) => {
  return <Wrapper>{children}</Wrapper>;
};

export default Card;
