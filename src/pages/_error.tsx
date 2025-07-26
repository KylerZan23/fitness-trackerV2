import Error from 'next/error'
import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode: number
}

const CustomErrorComponent = (props: ErrorProps) => {
  return <Error statusCode={props.statusCode} />
}

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  // Log error for debugging
  console.error('Page error caught:', contextData.err)

  // This will contain the status code of the response
  return Error.getInitialProps(contextData)
}

export default CustomErrorComponent
