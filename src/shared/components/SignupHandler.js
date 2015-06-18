import React from 'react';
import Signup from './SignupComponent';
import FluxComponent from 'flummox/component';

class SignupHandler extends React.Component{
  displayName: 'Signup'

  /*constructor(props) {
    super(props);
  }*/

  static async routerWillRun({flux, state}) {
    const pagesActions = flux.getActions('page');
    return await pagesActions.setTitle('Sign Up');
  }

  render() {
    return (
      <FluxComponent connectToStores={['signup']}>
        <Signup />
      </FluxComponent>
    );
  }
}

export default SignupHandler;