import { Navigate } from "react-router-dom"
import AuthenticationHelper from "../../util/AuthenticationHelper"

export function AuthPage() {
    const authentication = AuthenticationHelper.getAuthentication();
    if (authentication === null) {
        return <Navigate to="/" />
    }
    return (
        <div>
            <h1>Hello, {authentication?.email}</h1>
        </div>
    )
}