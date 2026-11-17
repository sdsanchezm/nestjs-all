// The HTTP adapter that actually runs. It implements HttpAdapter,
// so it satisfies the contract in http-adapter.interface.ts.
// CommonModule creates one instance and exports it for SeedService.

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios'
import { HttpAdapter } from './../interfaces/http-adapter.interface';

@Injectable()
export class AxiosAdapter implements HttpAdapter {

    // One axios client, kept on the class.
    // AxiosInstance is axios's type for that client.
    private axios: AxiosInstance = axios;

    async get<T>(url: string): Promise<T> {
        try {
            // axios puts the response body on .data, next to status and headers.
            // Callers of get() only need the body, typed as T.
            const { data } = await this.axios.get<T>( url );
            return data;

        } catch (error) {

            // Network failures and HTTP errors are replaced by this message.
            // The original axios error is not logged and not rethrown.
            throw new Error('This is an error - Check logs');
        }

    }

}
