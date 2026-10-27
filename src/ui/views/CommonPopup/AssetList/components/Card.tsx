import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  /* background: #f4f4f5; */
  background: var(--r-neutral-card-1, #f4f4f5);
  border-radius: 12px;
  padding: 20px 12px 12px 8px;
`;

const Card = ({ children }: { children: React.ReactNode }) => {
  return <Wrapper>{children}</Wrapper>;
};

export default Card;
