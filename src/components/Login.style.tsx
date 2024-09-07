import styled from "styled-components";

export const LoginWrapperStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h1 {
    margin: unset;
  }
`

export const ContinueButtonStyled = styled.button`
  padding: 4px 12px;
  border: 1px solid black;
  font-size: 21px;
  min-height: unset;
  transition: unset;
  font-weight: normal;
  color: whitesmoke;
  border-radius: 16px;
  background-color: slateblue;

  &:hover {
    background-color: #8774ff;
    color: black;
  }
`

export const ImbeddedButtonStyled = styled.div`
  position: relative;
  width: 330px;
  height: 70px;
  overflow: hidden;
  display: flex;

  .provider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`
