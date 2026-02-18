<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSecretRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:10000'],
            'ttlSeconds' => ['nullable', 'integer', 'min:10', 'max:2592000'], // 10 seconds to 30 days
            'maxViews' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'text.required' => 'The secret text is required.',
            'text.string' => 'The secret text must be a string.',
            'text.max' => 'The secret text may not be greater than 10,000 characters.',
            'ttlSeconds.integer' => 'The TTL must be an integer.',
            'ttlSeconds.min' => 'The TTL must be at least 10 seconds.',
            'ttlSeconds.max' => 'The TTL may not be greater than 30 days (2,592,000 seconds).',
            'maxViews.integer' => 'The max views must be an integer.',
            'maxViews.min' => 'The max views must be at least 1.',
            'maxViews.max' => 'The max views may not be greater than 100.',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'The given data was invalid.',
                'details' => $validator->errors(),
            ],
        ], 422));
    }
}
