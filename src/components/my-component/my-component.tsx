/// <reference types="firebase" />
declare var firebase: firebase.app.App;

import { Component, State } from '@stencil/core';

import { authState } from 'rxfire/auth';
import { collectionData } from 'rxfire/firestore';

import { switchMap } from 'rxjs/operators';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {
  @State()
  todos = [];

  @State()
  user;

  ref = firebase.firestore().collection('todos');

  componentWillLoad() {
    authState(firebase.auth()).subscribe(user => {
      console.log(user);
      this.user = user;
    });

    authState(firebase.auth())
      .pipe(
        switchMap(user => {
          if(user) {
            const query = this.ref.where('user', '==', user.uid).orderBy('createdDate', 'asc');
            return collectionData(query, 'taskId');
          } else {
            return [];
          }
        })
      )
      .subscribe(docs => {
        console.log('docs', docs);
        this.todos = docs
      });
  }

  login() {
    const provider = new (firebase.auth as any).GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  }

  logout() {
    firebase.auth().signOut();
  }

  addTask(user) {
    this.ref.add({ user: user.uid, task: 'blank task', createdDate: firebase.firestore['FieldValue'].serverTimestamp() });
  }

  removeTask(id) {
    this.ref.doc(id).delete();
  }

  render() {
    if(this.user) {
      return (
        <div>
          You're logged in as {this.user.uid}
          <button onClick={this.logout}>Log out</button>
          <hr />
          {this.todos.map(todo => (
            <li onClick={() => this.removeTask(todo.taskId)}>
              Task: {todo.task}
            </li>
          ))}
          <button onClick={() => this.addTask(this.user)}>Add Task</button>
        </div>
      );
    } else {
      return (
        <div>
          <button onClick={this.login}>Login with Google</button>
        </div>
      );
    }
  }
}
