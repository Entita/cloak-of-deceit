import styled from "styled-components";

export const MenuWrapperStyled = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: slateblue;
`

export const MenuContentStyled = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  padding: 0.8rem 1.4rem;
  border-radius: 8px;
  border: 1px solid black;
  row-gap: 6px;

  h1 {
    text-align: center;
  }
`

export const JoinWrapperStyled = styled.div`
  display: flex;

  input {
    border: 1px solid black;
    padding: 4px 8px;
    border-right: unset;
    border-radius: 4px 0 0 4px;
  }

  button {
    padding: 4px 8px;
    border: 1px solid black;
    border-radius: 0 4px 4px 0;
    background-color: slateblue;
    color: whitesmoke;

    &:hover {
      background-color: #695acdb0;
    }
  }
`

export const CreateLobbyButtonStyled = styled.button`
  border-radius: 4px;
  border: 1px solid black;
  padding: 8px 16px;
  font-size: 21px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: black;

  &:hover {
    background-color: #695acdb0;
    color: whitesmoke;
  }
`

export const LobbyCodeStyled = styled.span`

`

export const CopyStyled = styled.span`
  font-size: 10px;
  border: 1px solid black;
  padding-inline: 4px;
  border-radius: 4px;
  margin-left: 4px;
  background-color: #695acdb0;
  color: white;
  vertical-align: top;
  cursor: pointer;

  &:hover {
    background-color: slateblue;
  }
`

export const PlayersWrapperStyled = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 2px;
`

export const LeaderStyled = styled.span`
  margin-left: auto;
  color: gray;
  font-size: 11px;
`

export const KickStyled = styled.button`
  margin-left: auto;
  background-color: #ff8a8a;
  color: whitesmoke;
  font-size: 11px;
  border: 1px solid #ff6464;
  padding-inline: 4px;
  border-radius: 4px;

  &:hover {
    filter: brightness(.9);
  }
`

export const PlayerWrapperStyled = styled.div<{ $myself: Boolean }>`
  display: flex;
  padding: 2px 6px;
  border-bottom: 1px solid lightgray;
  background-color: ${({ $myself }) => $myself && 'lightgray'};
  color: ${({ $myself }) => $myself && 'gray'};
  border-radius: 2px;
`