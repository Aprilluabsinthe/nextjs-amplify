import {AmplifyAuthenticator} from "@aws-amplify/ui-react"
import Amplify, { API, Auth, withSSRContext} from "aws-amplify"
import styles from "../../src/styles/Home.module.css"
import {GetServerSideProps} from "next";
import {listTodos} from "../../../src/graphql/queries";
import {CreateTodoInput,CreateTodoMutation, ListTodosQuery, Todo} from "../../../src/API";
import {createTodo} from "../../../src/graphql/mutations";
import {GRAPHQL_AUTH_MODE} from "@aws-amplify/api"
import { useRouter } from 'next/router'
import awsExports from "../../../src/aws-exports"
import Head from "next/head";

Amplify.configure({...awsExports, ssr:true })

export default function Home({ todos = [] }:{ todos: Todo[] }) {
    const router = useRouter();

    async function handleCreateTodo(event){
        event.preventDefault();
        const form = new FormData(event.target)
        try{
            const createInput : CreateTodoInput = {
                name: form.get('title').toString(),
                description: form.get('content').toString(),
            }

            const request = (await API.graphql({
                authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
                query: createTodo,
                variables: {
                    input: createInput,
                },
            })) as { data: CreateTodoMutation; errors: any[] }
            router.push(`/todo/${request.data.createTodo.id}`)
        }catch({ errors }){
            console.error(...errors);
            throw new Error(errors[0].message);
        }
    }

  return (
      <div className={styles.container}>
          <Head>
              <title>Amplify + Next.js</title>
              <link rel="icon" href="/favicon.ico"/>
          </Head>

        <div className={styles.grid}>
          {todos.map((todo) => (
              <a href={`/todo/${todo.id}`} key={todo.id}>
                <h3>{todo.name}</h3>
                <p>{todo.description}</p>
              </a>
          ))}
        </div>
        <AmplifyAuthenticator>
          <form onSubmit={handleCreateTodo}>
              <fieldset>
                  <legend>Title</legend>
                  <input
                      defaultValue={`Today, ${new Date().toLocaleTimeString()}`}
                      name="title"
                  />
              </fieldset>
              <fieldset>
                  <legend>Content</legend>
                  <textarea
                      defaultValue="This is a todo app by Next.js and Amplify"
                      name="content"
                  />
              </fieldset>
              <button>Create Todo</button>
              <button type="button" onClick={() => Auth.signOut()}>
                  Sign out
              </button>
          </form>
        </AmplifyAuthenticator>
      </div>
  );
}


export const getServerSideProps: GetServerSideProps = async ({req}) =>{
  const SSR = withSSRContext({req});

  const response = (await SSR.API.graphql({ query:listTodos })) as {
    data: ListTodosQuery
  }

  return {
    props: {
      todos: response.data.listTodos.items,
    },
  }
}
